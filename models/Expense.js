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
    expenseType: {
        type: DataTypes.ENUM('food', 'salary', 'utilities', 'maintenance', 'supplies', 'marketing', 'insurance', 'taxes', 'rent', 'other'),
        allowNull: false,
        validate: {
            notNull: true,
            isIn: {
                args: [['food', 'salary', 'utilities', 'maintenance', 'supplies', 'marketing', 'insurance', 'taxes', 'rent', 'other']],
                msg: 'Expense type must be one of: food, salary, utilities, maintenance, supplies, marketing, insurance, taxes, rent, other'
            }
        }
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notEmpty: true,
            min: 0
        }
    },
    paymentMode: {
        type: DataTypes.ENUM('card', 'cash', 'upi', 'bank_transfer', 'cheque', 'online'),
        allowNull: false,
        validate: {
            notNull: true,
            isIn: {
                args: [['card', 'cash', 'upi', 'bank_transfer', 'cheque', 'online']],
                msg: 'Payment mode must be one of: card, cash, upi, bank_transfer, cheque, online'
            }
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