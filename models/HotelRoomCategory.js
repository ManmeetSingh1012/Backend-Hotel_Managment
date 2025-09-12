import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const HotelRoomCategory = sequelize.define('HotelRoomCategory', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  },
  categoryName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  hotelId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'hotels',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  roomCategoryPricing :{
    type : DataTypes.INTEGER,
    allowNull : true,
    defaultValue : null
  }
}, {
  tableName: 'hotel_room_categories',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

export default HotelRoomCategory;
