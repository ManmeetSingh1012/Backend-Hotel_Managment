import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const PaymentMode = sequelize.define('PaymentMode', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  },
  createdBy: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  paymentMode: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'payment_modes',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

export default PaymentMode;