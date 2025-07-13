import { sequelize } from '../config/database.js';
import User from './User.js';
import Hotel from './Hotel.js';
import HotelManager from './HotelManager.js';
import GuestRecord from './GuestRecord.js';

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

// Export models and sequelize instance
export {
  sequelize,
  User,
  Hotel,
  HotelManager,
  GuestRecord
}; 