import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const GuestPendingPayment = sequelize.define(
  "GuestPendingPayment",
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
    serialNo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    guestName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 200],
      },
    },

    checkinDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    checkoutDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    pendingAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notEmpty: true,
        min: 0,
      },
    },

    totalFood: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    rent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },

    totalPayment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
  },
  {
    tableName: "guest_pending_payments",
    timestamps: true,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  }
);

export default GuestPendingPayment;
