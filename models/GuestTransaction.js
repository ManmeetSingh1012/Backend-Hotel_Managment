import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import GuestRecord from './GuestRecord.js';

const GuestTransaction = sequelize.define('GuestTransaction', {
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
  paymentType: {
    type: DataTypes.ENUM('advance', 'partial', 'final' ),
    allowNull: false,
    defaultValue: 'partial'
  },
  paymentModeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'payment_modes',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
 
}, {
  tableName: 'guest_transactions',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

// Associations

export default GuestTransaction; 