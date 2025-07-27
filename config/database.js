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
const syncDatabase = async (databaseName = null, options = { alter: true }) => {
  try {
    const instance = databaseName ? createDatabaseInstance(databaseName) : sequelize;
    const dbName = instance.config.database;
    
    console.log(`🔄 Syncing database: ${dbName}`);
    await instance.sync(options);
    console.log(`✅ Database '${dbName}' synchronized successfully.`);
    
    // Close the connection if it's a temporary instance
    if (databaseName) {
      await instance.close();
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