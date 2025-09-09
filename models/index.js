import { sequelize } from '../config/database.js';
import User from './User.js';
import Hotel from './Hotel.js';
import HotelManager from './HotelManager.js';
import GuestRecord from './GuestRecord.js';
import Expense from './Expense.js';
import GuestTransaction from './GuestTransaction.js';
import GuestExpense from './GuestExpense.js';
import PaymentMode from './PaymentMode.js';
import ExpenseMode from './ExpenseMode.js';
import Menu from './Menu.js';
import GuestFoodOrder from './GuestFoodOrder.js';
// Define associations
// Hotel belongs to User (createdBy relationship)
Hotel.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

// HotelManager associations
HotelManager.belongsTo(Hotel, {
  foreignKey: 'hotelId',
  as: 'hotel'
});

HotelManager.belongsTo(User, {
  foreignKey: 'managerId',
  as: 'manager'
});

// Hotel has many Users through HotelManager (for managers)
Hotel.belongsToMany(User, {
  through: HotelManager,
  foreignKey: 'hotelId',
  otherKey: 'managerId',
  as: 'managers'
});

// User has many Hotels (as creator)
User.hasMany(Hotel, {
  foreignKey: 'createdBy',
  as: 'createdHotels'
});

// User belongs to many Hotels through HotelManager (as manager)
User.belongsToMany(Hotel, {
  through: HotelManager,
  foreignKey: 'managerId',
  otherKey: 'hotelId',
  as: 'managedHotels'
});

// Hotel has many HotelManagers
Hotel.hasMany(HotelManager, {
  foreignKey: 'hotelId',
  as: 'hotelManagers'
});

// User has many HotelManagers (as manager)
User.hasMany(HotelManager, {
  foreignKey: 'managerId',
  as: 'hotelAssignments'
});

// GuestRecord associations
GuestRecord.belongsTo(Hotel, {
  foreignKey: 'hotelId',
  as: 'hotel'
});

Hotel.hasMany(GuestRecord, {
  foreignKey: 'hotelId',
  as: 'guestRecords'
});

GuestRecord.hasMany(GuestTransaction, {
  foreignKey: 'bookingId',
  as: 'transactions'
});


GuestTransaction.belongsTo(GuestRecord, {
  foreignKey: 'bookingId',
  as: 'booking'
});

// GuestExpense associations
GuestExpense.belongsTo(GuestRecord, {
  foreignKey: 'bookingId',
  as: 'guestRecord'
});

GuestRecord.hasMany(GuestExpense, {
  foreignKey: 'bookingId',
  as: 'expenses'
});

// PaymentMode associations
PaymentMode.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

User.hasMany(PaymentMode, {
  foreignKey: 'createdBy',
  as: 'createdPaymentModes'
});

// GuestTransaction belongs to PaymentMode
GuestTransaction.belongsTo(PaymentMode, {
  foreignKey: 'paymentModeId',
  as: 'paymentMode'
});

PaymentMode.hasMany(GuestTransaction, {
  foreignKey: 'paymentModeId',
  as: 'transactions'
});

// Expense associations
Expense.belongsTo(Hotel, {
  foreignKey: 'hotelId',
  as: 'hotel'
});

Hotel.hasMany(Expense, {
  foreignKey: 'hotelId',
  as: 'expenses'
});

// Expense belongs to ExpenseMode
Expense.belongsTo(ExpenseMode, {
  foreignKey: 'expenseModeId',
  as: 'expenseMode'
});

ExpenseMode.hasMany(Expense, {
  foreignKey: 'expenseModeId',
  as: 'expenses'
});

// ExpenseMode associations


ExpenseMode.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

User.hasMany(ExpenseMode, {
  foreignKey: 'createdBy',
  as: 'createdExpenseModes'
});

// Menu associations
Menu.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

User.hasMany(Menu, {
  foreignKey: 'createdBy',
  as: 'createdMenus'
});

// GuestFoodOrder associations
GuestFoodOrder.belongsTo(GuestExpense, {
  foreignKey: 'guestExpenseId',
  as: 'guestExpense'
});

GuestExpense.hasMany(GuestFoodOrder, {
  foreignKey: 'guestExpenseId',
  as: 'foodOrders'
});

GuestFoodOrder.belongsTo(Menu, {
  foreignKey: 'menuId',
  as: 'menu'
});

Menu.hasMany(GuestFoodOrder, {
  foreignKey: 'menuId',
  as: 'foodOrders'
});

// Export models and sequelize instance
export {
  sequelize,
  User,
  Hotel,
  HotelManager,
  GuestRecord,
  Expense,
  GuestTransaction,
  GuestExpense,
  PaymentMode,
  ExpenseMode,
  Menu,
  GuestFoodOrder
}; 