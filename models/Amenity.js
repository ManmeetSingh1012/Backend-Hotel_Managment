// models/Amenity.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Amenity = sequelize.define('Amenity', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  isChargeable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  defaultPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  }
}, {
  tableName: 'amenities',
  timestamps: true
});

export default Amenity;
