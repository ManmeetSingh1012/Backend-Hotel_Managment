import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Expense = sequelize.define('Expense', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false
    },
    hotelId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'hotels',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    },
    expenseModeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'expense_modes',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notEmpty: true,
            min: 0
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
   
}, {
    tableName: 'expenses',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

export default Expense;     