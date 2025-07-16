import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Hotel = sequelize.define('Hotel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200]
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 1000]
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^[\+]?[1-9][\d]{0,15}$/ // International phone number format
    }
  },
 
  totalRooms: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      isInt: true
    }
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  }
}, {
  tableName: 'hotels',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

export default Hotel; 