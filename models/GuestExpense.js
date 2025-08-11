import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import GuestRecord from './GuestRecord.js';

const GuestExpense = sequelize.define('GuestExpense', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'guest_records',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  expenseType: {
    type: DataTypes.ENUM('food', 'laundry', 'others'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'guest_expenses',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

export default GuestExpense; 