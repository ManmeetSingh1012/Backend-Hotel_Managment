import { sequelize } from "../config/database.js";
import GuestTransaction from "../models/GuestTransaction.js";
import GuestRecord from "../models/GuestRecord.js";
import PaymentMode from "../models/PaymentMode.js";
import GuestExpense from "../models/GuestExpense.js";
import GuestFoodOrder from "../models/GuestFoodOrder.js";
import Menu from "../models/Menu.js";
import Hotel from "../models/Hotel.js";
import HotelManager from "../models/HotelManager.js";
import GuestPendingPayment from "../models/GuestPendingpayment.js";
import { json2csv } from "json-2-csv";
import { Op } from "sequelize";

export const getPaymentModeReport = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const userId = req.user.id;
    // Validate required parameters
    if (!hotelId) {
      return res.status(400).json({
        success: false,
        error: "Hotel ID is required",
      });
    }

    const now = new Date();

    // Calculate date range for today (00:00:00 to 23:59:59 today only)
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    // Calculate date range for this month (from 1st day to last day of current month)
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
    // More reliable way: start of next month minus 1 millisecond
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0,
      -1
    );

    console.log("Date Ranges:");
    console.log(
      "Today:",
      todayStart.toISOString(),
      "to",
      todayEnd.toISOString()
    );
    console.log(
      "Month:",
      monthStart.toISOString(),
      "to",
      monthEnd.toISOString()
    );

    // First, get all payment modes created by the current user
    const allPaymentModes = await PaymentMode.findAll({
      attributes: ["id", "paymentMode"],
      where: { createdBy: userId },
      raw: true,
    });

    // Query for today's data (paymentDate between todayStart and todayEnd)
    const todayTransactions = await GuestTransaction.findAll({
      attributes: [
        [sequelize.col("paymentMode.id"), "paymentModeId"],
        [sequelize.col("paymentMode.paymentMode"), "paymentMode"],
        [
          sequelize.fn("SUM", sequelize.col("GuestTransaction.amount")),
          "totalAmount",
        ],
      ],
      include: [
        {
          model: GuestRecord,
          as: "booking",
          attributes: [],
          where: {
            hotelId: hotelId,
          },
          required: true,
        },
        {
          model: PaymentMode,
          as: "paymentMode",
          attributes: [],
          where: { createdBy: userId },
          required: true,
        },
      ],
      where: {
        paymentDate: {
          [Op.gte]: todayStart,
          [Op.lte]: todayEnd,
        },
      },
      group: ["paymentMode.id", "paymentMode.paymentMode"],
      raw: true,
    });

    // Query for this month's data (paymentDate between monthStart and monthEnd)
    const monthTransactions = await GuestTransaction.findAll({
      attributes: [
        [sequelize.col("paymentMode.id"), "paymentModeId"],
        [sequelize.col("paymentMode.paymentMode"), "paymentMode"],
        [
          sequelize.fn("SUM", sequelize.col("GuestTransaction.amount")),
          "totalAmount",
        ],
      ],
      include: [
        {
          model: GuestRecord,
          as: "booking",
          attributes: [],
          where: {
            hotelId: hotelId,
          },
          required: true,
        },
        {
          model: PaymentMode,
          as: "paymentMode",
          attributes: [],
          where: { createdBy: userId },
          required: true,
        },
      ],
      where: {
        paymentDate: {
          [Op.gte]: monthStart,
          [Op.lte]: monthEnd,
        },
      },
      group: ["paymentMode.id", "paymentMode.paymentMode"],
      raw: true,
    });

    // Create maps for quick lookup of transaction amounts
    const todayAmountMap = {};
    todayTransactions.forEach((item) => {
      todayAmountMap[item.paymentModeId] = parseFloat(item.totalAmount) || 0;
    });

    const monthAmountMap = {};
    monthTransactions.forEach((item) => {
      monthAmountMap[item.paymentModeId] = parseFloat(item.totalAmount) || 0;
    });

    // Format today's data - include all payment modes with their amounts (0 if no transactions)
    const todayData = allPaymentModes.map((paymentMode) => ({
      paymentMode: paymentMode.paymentMode,
      totalAmount: todayAmountMap[paymentMode.id] || 0,
    }));

    // Format this month's data - include all payment modes with their amounts (0 if no transactions)
    const monthData = allPaymentModes.map((paymentMode) => ({
      paymentMode: paymentMode.paymentMode,
      totalAmount: monthAmountMap[paymentMode.id] || 0,
    }));

    // Return successful response with both datasets
    res.status(200).json({
      success: true,
      data: {
        today: todayData,
        thisMonth: monthData,
        meta: {
          hotelId,
          todayTotal: todayData.reduce(
            (sum, item) => sum + item.totalAmount,
            0
          ),
          monthTotal: monthData.reduce(
            (sum, item) => sum + item.totalAmount,
            0
          ),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching payment mode report:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to fetch payment mode report",
    });
  }
};

export const exportPaymentModeReportCSV = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const userId = req.user.id;

    // Validate required parameters
    if (!hotelId) {
      return res.status(400).json({
        success: false,
        error: "Hotel ID is required",
      });
    }

    const now = new Date();

    // Calculate date range for today (00:00:00 to 23:59:59 today only)
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    // Calculate date range for this month (from 1st day to last day of current month)
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0,
      -1
    );

    // First, get all payment modes created by the current user
    const allPaymentModes = await PaymentMode.findAll({
      attributes: ["id", "paymentMode"],
      where: { createdBy: userId },
      raw: true,
    });

    // Query for today's data
    const todayTransactions = await GuestTransaction.findAll({
      attributes: [
        [sequelize.col("paymentMode.id"), "paymentModeId"],
        [sequelize.col("paymentMode.paymentMode"), "paymentMode"],
        [
          sequelize.fn("SUM", sequelize.col("GuestTransaction.amount")),
          "totalAmount",
        ],
      ],
      include: [
        {
          model: GuestRecord,
          as: "booking",
          attributes: [],
          where: {
            hotelId: hotelId,
          },
          required: true,
        },
        {
          model: PaymentMode,
          as: "paymentMode",
          attributes: [],
          where: { createdBy: userId },
          required: true,
        },
      ],
      where: {
        paymentDate: {
          [Op.gte]: todayStart,
          [Op.lte]: todayEnd,
        },
      },
      group: ["paymentMode.id", "paymentMode.paymentMode"],
      raw: true,
    });

    // Query for this month's data
    const monthTransactions = await GuestTransaction.findAll({
      attributes: [
        [sequelize.col("paymentMode.id"), "paymentModeId"],
        [sequelize.col("paymentMode.paymentMode"), "paymentMode"],
        [
          sequelize.fn("SUM", sequelize.col("GuestTransaction.amount")),
          "totalAmount",
        ],
      ],
      include: [
        {
          model: GuestRecord,
          as: "booking",
          attributes: [],
          where: {
            hotelId: hotelId,
          },
          required: true,
        },
        {
          model: PaymentMode,
          as: "paymentMode",
          attributes: [],
          where: { createdBy: userId },
          required: true,
        },
      ],
      where: {
        paymentDate: {
          [Op.gte]: monthStart,
          [Op.lte]: monthEnd,
        },
      },
      group: ["paymentMode.id", "paymentMode.paymentMode"],
      raw: true,
    });

    // Create maps for quick lookup of transaction amounts
    const todayAmountMap = {};
    todayTransactions.forEach((item) => {
      todayAmountMap[item.paymentModeId] = parseFloat(item.totalAmount) || 0;
    });

    const monthAmountMap = {};
    monthTransactions.forEach((item) => {
      monthAmountMap[item.paymentModeId] = parseFloat(item.totalAmount) || 0;
    });

    // Format data for CSV
    const csvData = allPaymentModes.map((paymentMode) => ({
      "Payment Mode": paymentMode.paymentMode,
      "Today Amount": todayAmountMap[paymentMode.id] || 0,
      "This Month Amount": monthAmountMap[paymentMode.id] || 0,
    }));

    // Calculate totals
    const todayTotal = csvData.reduce(
      (sum, item) => sum + item["Today Amount"],
      0
    );
    const monthTotal = csvData.reduce(
      (sum, item) => sum + item["This Month Amount"],
      0
    );

    // Add totals row
    csvData.push({
      "Payment Mode": "Total",
      "Today Amount": todayTotal,
      "This Month Amount": monthTotal,
    });

    // Configure json-2-csv options
    const options = {
      keys: ["Payment Mode", "Today Amount", "This Month Amount"],
      delimiter: {
        field: ",",
        wrap: '"',
        eol: "\n",
      },
      prependHeader: true,
      sortHeader: false,
      trimFieldValues: true,
      trimHeaderFields: true,
    };

    // Generate CSV content using json-2-csv
    const csvContent = await json2csv(csvData, options);

    // Set response headers for CSV download
    const fileName = `payment-mode-report-${hotelId}-${
      now.toISOString().split("T")[0]
    }.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", Buffer.byteLength(csvContent, "utf8"));

    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting payment mode report CSV:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to export payment mode report CSV",
    });
  }
};

export const generateCustomerBill = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Validate required parameters
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: "Booking ID is required",
      });
    }

    // Find the guest record with hotel information
    const guestRecord = await GuestRecord.findByPk(bookingId, {
      include: [
        {
          model: Hotel,
          as: "hotel",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!guestRecord) {
      return res.status(404).json({
        success: false,
        error: "Guest record not found",
        message: "The specified booking ID does not exist",
      });
    }

    // Authorization is already checked by the middleware

    // Parse check-in and check-out dates
    const checkinDate = new Date(guestRecord.checkinDate);
    const checkoutDate = guestRecord.checkoutDate
      ? new Date(guestRecord.checkoutDate)
      : new Date();

    // If no checkout date, use current date
    const endDate = guestRecord.checkoutDate ? checkoutDate : new Date();

    // Generate array of dates from check-in to check-out
    const dateRange = [];
    const currentDate = new Date(checkinDate);

    while (currentDate <= endDate) {
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get all expenses for this booking
    const expenses = await GuestExpense.findAll({
      where: { bookingId },
      include: [
        {
          model: GuestFoodOrder,
          as: "foodOrders",
          include: [
            {
              model: Menu,
              as: "menu",
              attributes: ["name"],
            },
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    // Get all transactions for this booking
    const transactions = await GuestTransaction.findAll({
      where: { bookingId },
      include: [
        {
          model: PaymentMode,
          as: "paymentMode",
          attributes: ["paymentMode"],
        },
      ],
      order: [["paymentDate", "ASC"]],
    });

    // Create date-wise breakdown
    const dailyBreakdown = dateRange.map((date) => {
      const dateStr = date.toISOString().split("T")[0];
      const dayExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.createdAt)
          .toISOString()
          .split("T")[0];
        return expenseDate === dateStr;
      });

      const dayTransactions = transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.paymentDate)
          .toISOString()
          .split("T")[0];
        return transactionDate === dateStr;
      });

      // Calculate daily rent
      const dailyRent = parseFloat(guestRecord.rent);

      // Calculate daily expenses
      let dailyExpenses = 0;
      const foodDetails = [];
      const otherExpenses = [];

      dayExpenses.forEach((expense) => {
        dailyExpenses += parseFloat(expense.amount);

        // Add food details if it's a food expense
        if (expense.expenseType === "food" && expense.foodOrders) {
          expense.foodOrders.forEach((order) => {
            foodDetails.push({
              name: order.menu.name,
              quantity: order.quantity,
              portionType: order.portionType,
              unitPrice: parseFloat(order.unitPrice).toFixed(2),
              totalPrice: parseFloat(order.unitPrice * order.quantity).toFixed(
                2
              ),
            });
          });
        } else if (expense.expenseType !== "food") {
          // Add other expense types (laundry, others)
          otherExpenses.push({
            type: expense.expenseType,
            amount: parseFloat(expense.amount).toFixed(2),
            description: `${
              expense.expenseType.charAt(0).toUpperCase() +
              expense.expenseType.slice(1)
            } expense`,
          });
        }
      });

      // Calculate daily payments
      const dailyPayments = dayTransactions.reduce((sum, transaction) => {
        return sum + parseFloat(transaction.amount);
      }, 0);

      return {
        date: dateStr,
        dailyRent: dailyRent.toFixed(2),
        dailyExpenses: dailyExpenses.toFixed(2),
        dailyPayments: dailyPayments.toFixed(2),
        foodDetails: foodDetails,
        otherExpenses: otherExpenses,
        netDailyAmount: (dailyRent + dailyExpenses - dailyPayments).toFixed(2),
      };
    });

    // Calculate totals
    const totalRent = dateRange.length * parseFloat(guestRecord.rent);
    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + parseFloat(expense.amount),
      0
    );
    const totalPayments = transactions.reduce(
      (sum, transaction) => sum + parseFloat(transaction.amount),
      0
    );
    const pendingAmount = totalRent + totalExpenses - totalPayments;

    // Get all food orders for the entire stay
    const allFoodOrders = [];
    const allOtherExpenses = [];

    expenses.forEach((expense) => {
      if (expense.expenseType === "food" && expense.foodOrders) {
        expense.foodOrders.forEach((order) => {
          allFoodOrders.push({
            date: new Date(expense.createdAt).toISOString().split("T")[0],
            name: order.menu.name,
            quantity: order.quantity,
            portionType: order.portionType,
            unitPrice: parseFloat(order.unitPrice).toFixed(2),
            totalPrice: parseFloat(order.unitPrice * order.quantity).toFixed(2),
          });
        });
      } else if (expense.expenseType !== "food") {
        allOtherExpenses.push({
          date: new Date(expense.createdAt).toISOString().split("T")[0],
          type: expense.expenseType,
          amount: parseFloat(expense.amount).toFixed(2),
          description: `${
            expense.expenseType.charAt(0).toUpperCase() +
            expense.expenseType.slice(1)
          } expense`,
        });
      }
    });

    // Return comprehensive bill
    res.status(200).json({
      success: true,
      message: "Customer bill generated successfully",
      data: {
        guestInfo: {
          bookingId: guestRecord.id,
          guestName: guestRecord.guestName,
          phoneNo: guestRecord.phoneNo,
          roomNo: guestRecord.roomNo,
          checkinDate: guestRecord.checkinDate,
          checkoutDate: guestRecord.checkoutDate,
          hotelName: guestRecord.hotel.name,
        },
        billSummary: {
          totalDays: dateRange.length,
          dailyRent: parseFloat(guestRecord.rent).toFixed(2),
          totalRent: totalRent.toFixed(2),
          totalExpenses: totalExpenses.toFixed(2),
          totalPayments: totalPayments.toFixed(2),
          pendingAmount: pendingAmount.toFixed(2),
        },
        dailyBreakdown: dailyBreakdown,
        allFoodOrders: allFoodOrders,
        allOtherExpenses: allOtherExpenses,
        paymentHistory: transactions.map((transaction) => ({
          date: transaction.paymentDate,
          amount: parseFloat(transaction.amount).toFixed(2),
          paymentMode: transaction.paymentMode.paymentMode,
          paymentType: transaction.paymentType,
        })),
      },
    });
  } catch (error) {
    console.error("Error generating customer bill:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to generate customer bill",
    });
  }
};

export const exportGuestRecordsByHotelCSV = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { date } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!hotelId) {
      return res
        .status(400)
        .json({ success: false, error: "Hotel ID is required" });
    }

    const targetDate = date || new Date().toISOString().split("T")[0];

    // Authorisation check
    if (userRole === "manager") {
      const assignment = await HotelManager.findOne({
        where: { managerId: userId, hotelId, status: "active" },
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
          message: "You do not have access to this hotel",
        });
      }
    } else if (userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Access denied",
        message: "You do not have permission to export guest records",
      });
    }

    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: "Hotel not found",
        message: "The specified hotel does not exist",
      });
    }

    // Guest records
    const guestRecords = await GuestRecord.findAll({
      where: {
        hotelId,
        checkinDate: {
          [Op.and]: [{ [Op.ne]: null }, { [Op.lte]: targetDate }],
        },
        [Op.or]: [{ checkoutDate: null }, { checkoutDate: targetDate }],
      },
      include: [{ model: Hotel, as: "hotel", attributes: ["id", "name"] }],
      order: [["createdAt", "DESC"]],
    });

    if (guestRecords.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No guest records found",
        message: "No guest records found for the specified date and hotel",
      });
    }

    const guestIds = guestRecords.map((r) => r.id);

    // Transactions
    const transactions = await GuestTransaction.findAll({
      where: {
        bookingId: { [Op.in]: guestIds },
        [Op.and]: [
          sequelize.where(
            sequelize.fn("DATE", sequelize.col("GuestTransaction.createdAt")),
            targetDate
          ),
        ],
      },
      attributes: ["bookingId", "amount", "paymentType"],
      include: [
        {
          model: PaymentMode,
          as: "paymentMode",
          attributes: ["paymentMode"], // <-- the string value
        },
      ],
      raw: true,
      nest: true,
    });

    // Expenses
    const expenses = await GuestExpense.findAll({
      where: {
        bookingId: { [Op.in]: guestIds },
        [Op.and]: [
          sequelize.where(
            sequelize.fn("DATE", sequelize.col("GuestExpense.createdAt")),
            targetDate
          ),
        ],
      },
      attributes: ["bookingId", "expenseType", "amount"],
      raw: true,
    });

    // Grouping
    const transactionsByBooking = {};
    transactions.forEach((t) => {
      if (!transactionsByBooking[t.bookingId])
        transactionsByBooking[t.bookingId] = [];
      transactionsByBooking[t.bookingId].push(t);
    });

    const expensesByBooking = {};
    expenses.forEach((e) => {
      if (!expensesByBooking[e.bookingId]) expensesByBooking[e.bookingId] = {};
      if (!expensesByBooking[e.bookingId][e.expenseType])
        expensesByBooking[e.bookingId][e.expenseType] = 0;
      expensesByBooking[e.bookingId][e.expenseType] += parseFloat(
        e.amount || 0
      );
    });

    // Pending amount map
    const pendingAmountMap = {};
    for (const record of guestRecords) {
      if (!record.checkinDate) continue;
      const checkinDate = record.checkinDate;

      const guestBills = await GuestRecord.findAll({
        attributes: [
          [
            sequelize.literal(`
              SUM(
                "GuestRecord"."bill" * 
                (DATE_PART('day', '${targetDate}'::timestamp - "GuestRecord"."checkinDate"::timestamp) + 1)
              )
            `),
            "totalBill",
          ],
        ],
        where: {
          id: record.id,
          checkinDate: {
            [Op.and]: [{ [Op.ne]: null }, { [Op.lte]: targetDate }],
          },
          [Op.or]: [
            { checkoutDate: null },
            { checkoutDate: { [Op.lte]: targetDate } },
          ],
        },
        raw: true,
      });

      const guestFoodExpenses = await GuestExpense.findAll({
        attributes: [
          [
            sequelize.literal(`
              SUM(CASE WHEN "GuestExpense"."expenseType" = 'food' THEN "GuestExpense"."amount" ELSE 0 END)
            `),
            "totalFoodExpenses",
          ],
        ],
        where: {
          bookingId: record.id,
          createdAt: {
            [Op.gte]: checkinDate,
            [Op.lte]: sequelize.literal(`'${targetDate} 23:59:59'`),
          },
        },
        raw: true,
      });

      const guestPayments = await GuestTransaction.findAll({
        attributes: [
          [
            sequelize.literal(`
              SUM(CASE WHEN "GuestTransaction"."paymentType" IN ('partial', 'advance', 'final') THEN "GuestTransaction"."amount" ELSE 0 END)
            `),
            "totalPayments",
          ],
        ],
        where: {
          bookingId: record.id,
          createdAt: {
            [Op.gte]: checkinDate,
            [Op.lte]: sequelize.literal(`'${targetDate} 23:59:59'`),
          },
        },
        raw: true,
      });

      const totalBill = parseFloat(guestBills[0]?.totalBill || 0);
      const totalFoodExpenses = parseFloat(
        guestFoodExpenses[0]?.totalFoodExpenses || 0
      );
      const totalPayments = parseFloat(guestPayments[0]?.totalPayments || 0);

      pendingAmountMap[record.id] = Math.max(
        0,
        totalBill + totalFoodExpenses - totalPayments
      );
    }

    // Build Guest CSV
    const guestCsvData = [];
    for (const record of guestRecords) {
      const r = record.toJSON();
      const id = r.id;
      const guestExpenses = expensesByBooking[id] || {};
      const totalFoodExpenses = parseFloat(guestExpenses.food || 0);
      const totalOtherExpenses = Object.keys(guestExpenses)
        .filter((t) => t !== "food")
        .reduce((sum, t) => sum + parseFloat(guestExpenses[t] || 0), 0);
      const pendingAmount = pendingAmountMap[id] || 0;

      guestCsvData.push({
        "Serial No": r.serialNo,
        "Guest Name": r.guestName || "",
        "Phone Number": r.phoneNo || "",
        "Room Number": r.roomNo || "",
        "Check-in Date": r.checkinDate
          ? new Date(r.checkinDate).toLocaleDateString()
          : "",
        "Check-out Date": r.checkoutDate
          ? new Date(r.checkoutDate).toLocaleDateString()
          : "",
        "Daily Rent": parseFloat(r.rent || 0).toFixed(2),
        Bill: parseFloat(r.bill || 0).toFixed(2),
        "Food Expenses Today": totalFoodExpenses.toFixed(2),
        "Other Expenses Today": totalOtherExpenses.toFixed(2),
        "Pending Amount": pendingAmount.toFixed(2),
      });
    }

    // Build Payments CSV
    const paymentCsvData = [];
    for (const record of guestRecords) {
      const r = record.toJSON();
      const id = r.id;
      const guestTransactions = transactionsByBooking[id] || [];

      guestTransactions.forEach((t) => {
        paymentCsvData.push({
          "Serial No": r.serialNo,
          "Guest Name": r.guestName || "",
          Date: targetDate,
          "Payment Type": t.paymentType || "",
          "Payment Mode": t.paymentMode?.paymentMode || "", // <-- fixed
          "Amount Paid": parseFloat(t.amount || 0).toFixed(2),
        });
      });
    }

    // Convert both tables
    const guestCsv = await json2csv(guestCsvData, {
      keys: Object.keys(guestCsvData[0]),
    });
    const paymentCsv =
      paymentCsvData.length > 0
        ? await json2csv(paymentCsvData, {
            keys: Object.keys(paymentCsvData[0]),
          })
        : "No Payments Found";

    // Merge into single CSV with separation
    const csvContent = guestCsv + "\n\nPAYMENTS\n" + paymentCsv;

    const fileName = `guest-records-${hotel.name}-${targetDate}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", Buffer.byteLength(csvContent, "utf8"));

    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting guest records CSV:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to export guest records CSV",
    });
  }
};

// Export pending payments report for current month in CSV format
export const exportPendingPaymentsReportCSV = async (req, res) => {
  try {
    const { hotelId } = req.params;

    // Validate hotel ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!hotelId || !uuidRegex.test(hotelId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid hotel ID format",
        message: "Please provide a valid hotel ID (UUID)",
      });
    }

    // Check if hotel exists
    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        error: "Hotel not found",
        message: "The specified hotel does not exist",
      });
    }

    const now = new Date();

    // Calculate date range for current month (from 1st day to last day of current month)
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0,
      -1
    );

    console.log("Current Month Range:");
    console.log(
      "From:",
      monthStart.toISOString(),
      "To:",
      monthEnd.toISOString()
    );

    // Get pending payments for the hotel created in current month
    const pendingPayments = await GuestPendingPayment.findAll({
      where: {
        hotelId: hotelId,
        createdAt: {
          [Op.gte]: monthStart,
          [Op.lte]: monthEnd,
        },
      },
      include: [
        {
          model: Hotel,
          as: "hotel",
          attributes: ["id", "name", "address", "phone"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (pendingPayments.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No pending payments found",
        message: "No pending payments found for the current month",
      });
    }

    // Format data for CSV with the required format: GUEST NAME, SR NO, FOOD, RENT, TOTAL PAYMENT, TO BE RECEIVED
    const csvData = pendingPayments.map((payment) => ({
      "GUEST NAME": payment.guestName || "",
      "SR NO": payment.serialNo || "",
      FOOD: parseFloat(payment.totalFood || 0).toFixed(2),
      RENT: parseFloat(payment.rent || 0).toFixed(2),
      "TOTAL PAYMENT": parseFloat(payment.totalPayment || 0).toFixed(2),
      "TO BE RECEIVED": parseFloat(payment.pendingAmount || 0).toFixed(2),
    }));

    // Calculate totals
    const totalFoodAmount = pendingPayments.reduce(
      (sum, payment) => sum + parseFloat(payment.totalFood || 0),
      0
    );
    const totalRentAmount = pendingPayments.reduce(
      (sum, payment) => sum + parseFloat(payment.rent || 0),
      0
    );
    const totalPaymentAmount = pendingPayments.reduce(
      (sum, payment) => sum + parseFloat(payment.totalPayment || 0),
      0
    );
    const totalPendingAmount = pendingPayments.reduce(
      (sum, payment) => sum + parseFloat(payment.pendingAmount || 0),
      0
    );

    // Add totals row
    csvData.push({
      "GUEST NAME": "TOTAL",
      "SR NO": "",
      FOOD: totalFoodAmount.toFixed(2),
      RENT: totalRentAmount.toFixed(2),
      "TOTAL PAYMENT": totalPaymentAmount.toFixed(2),
      "TO BE RECEIVED": totalPendingAmount.toFixed(2),
    });

    // Configure json-2-csv options
    const options = {
      keys: [
        "GUEST NAME",
        "SR NO",
        "FOOD",
        "RENT",
        "TOTAL PAYMENT",
        "TO BE RECEIVED",
      ],
      delimiter: {
        field: ",",
        wrap: '"',
        eol: "\n",
      },
      prependHeader: true,
      sortHeader: false,
      trimFieldValues: true,
      trimHeaderFields: true,
    };

    // Generate CSV content using json-2-csv
    const csvContent = await json2csv(csvData, options);

    // Set response headers for CSV download
    const fileName = `pending-payments-report-${
      hotel.name
    }-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", Buffer.byteLength(csvContent, "utf8"));

    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Error exporting pending payments report CSV:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Failed to export pending payments report CSV",
    });
  }
};
