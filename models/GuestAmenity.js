// models/GuestAmenity.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const GuestAmenity = sequelize.define('GuestAmenity', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  guestRecordId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  amenityId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1 }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  isChargeable: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  }
}, {
  tableName: 'guest_amenities',
  timestamps: true
});

export default GuestAmenity;
