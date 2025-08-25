import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';


const Menu = sequelize.define('Menu', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    halfPlatePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    fullPlatePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
  
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    }
},{
    tableName: 'menus',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

export default Menu;