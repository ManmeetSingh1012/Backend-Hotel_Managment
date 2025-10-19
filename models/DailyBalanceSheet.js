import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const DailyBalanceSheet = sequelize.define(
  "DailyBalanceSheet",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
    },
    hotelId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "hotels",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      unique: ["hotelId", "date"], // Ensure one record per hotel per day
    },

    // Opening Balance (Previous day's closing balance)
    openingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Room Bookings for the day
    totalRoomsBooked: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    // Total Bills (Food + Rent)
    totalBill: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Pending Amount
    totalPendingAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Total Expenses
    totalExpenses: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Payment Modes with amounts (JSON field to store all payment modes)
    paymentModes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },

    // Cash in Hand
    cashInHand: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Closing Balance
    closingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    // Additional tracking fields
    totalGuestsCheckedOut: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalTransactions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "daily_balance_sheets",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  }
);

export default DailyBalanceSheet;
