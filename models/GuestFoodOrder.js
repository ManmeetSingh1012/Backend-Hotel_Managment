import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';


const GuestFoodOrder = sequelize.define('GuestFoodOrder', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false
    },
    guestExpenseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'guest_expenses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    menuId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'menus',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    portionType: {
      type: DataTypes.ENUM('half', 'full'),
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
      allowNull: false
    }
  }, {
    tableName: 'guest_food_orders',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });
  
  export default GuestFoodOrder;