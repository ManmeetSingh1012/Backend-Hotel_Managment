import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Supabase PostgreSQL connection configuration
const getDatabaseConfig = () => {
  console.log('🔗 Attempting to connect to database...');
  
  if (process.env.DATABASE_URL) {
    // Parse the DATABASE_URL manually to avoid password parsing issues
    const url = new URL(process.env.DATABASE_URL);
    
    return {
      host: url.hostname,
      port: url.port || 5432,
      database: url.pathname.slice(1), // Remove leading slash
      username: url.username,
      password: url.password,
      dialect: 'postgres',
      dialectOptions: {
        ssl: false
      },
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    };
  }

  // Default local development configuration
  console.warn('⚠️  No Supabase database configuration found');
  
  return {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    username: 'postgres',
    password: 'manmeet',
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    },
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  };
};

// Create Sequelize instance
const sequelize = new Sequelize(getDatabaseConfig());

// Function to create a Sequelize instance for a specific database
const createDatabaseInstance = (databaseName) => {
  if (!databaseName) {
    throw new Error('Database name is required');
  }
  
  const config = getDatabaseConfig(databaseName);
  return new Sequelize(config);
};

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
    console.log(`🔗 Connected to: ${sequelize.config.database || sequelize.config.url?.split('/').pop()}`);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    console.error('💡 Make sure your Supabase database credentials are correct');
  }
}

// Sync database (create tables if they don't exist)
// Parameters:
// - tableName: string (optional) - specific table to sync, if not provided syncs all tables
// - options: object (optional) - sync options like { alter: true, force: false }
const syncDatabase = async (tableName = null, options = { alter: true }) => {
  try {
    const dbName = sequelize.config.database;
    
    if (tableName) {
      // Sync specific table
      console.log(`🔄 Syncing specific table: ${tableName} in database: ${dbName}`);
      
      // Import models to get the specific table model
      const { User, Hotel, HotelManager, GuestRecord, Expense, GuestTransaction, GuestExpense, PaymentMode, ExpenseMode, Menu } = await import('../models/index.js');
      
      // Map table names to models
      const modelMap = {
        'users': User,
        'hotels': Hotel,
        'hotel_managers': HotelManager,
        'guest_records': GuestRecord,
        'expenses': Expense,
        'guest_transactions': GuestTransaction,
        'guest_expenses': GuestExpense,
        'payment_modes': PaymentMode,
        'expense_modes': ExpenseMode,
        'menus': Menu
      };
      
      const model = modelMap[tableName.toLowerCase()];
      if (!model) {
        throw new Error(`Table '${tableName}' not found. Available tables: ${Object.keys(modelMap).join(', ')}`);
      }
      
      await model.sync(options);
      console.log(`✅ Table '${tableName}' synchronized successfully.`);
    } else {
      // Sync all tables
      console.log(`🔄 Syncing all tables in database: ${dbName}`);
      await sequelize.sync(options);
      console.log(`✅ All tables in database '${dbName}' synchronized successfully.`);
    }
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

export {
  sequelize,
  createDatabaseInstance,
  testConnection,
  syncDatabase
}; 