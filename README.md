# Hotel Management System Backend

A complete Node.js backend for a Hotel Management System with user authentication, built with Express.js, Sequelize ORM, and PostgreSQL.

## Features

- 🔐 **Complete User Authentication System**
  - User signup with validation
  - User signin with username OR email
  - JWT token-based authentication
  - Password hashing with bcryptjs
  - Role-based access control (admin/manager)

- 🛡️ **Security Features**
  - Password hashing with bcryptjs (12 salt rounds)
  - JWT token authentication
  - Input validation and sanitization
  - Helmet.js for security headers
  - CORS configuration

- 🗄️ **Database**
  - PostgreSQL with Sequelize ORM
  - Automatic table creation
  - Data validation and constraints

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/hotel_pms_db

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   ```

4. **Database Setup**
   - Create a PostgreSQL database named `hotel_pms_db`
   - Update the `DATABASE_URL` in your `.env` file with your database credentials

5. **Start the server**
   ```bash
   # Development mode with auto-restart
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Endpoints

#### 1. User Signup
- **POST** `/api/users/signup`
- **Description**: Register a new user
- **Body**:
  ```json
  {
    "name": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "password": "password123",
    "role": "admin"
  }
  ```
- **Response** (Success - 201):
  ```json
  {
    "success": true,
    "message": "User created successfully",
    "user": {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "admin"
    },
    "token": "jwt_token_here"
  }
  ```

#### 2. User Signin
- **POST** `/api/users/signin`
- **Description**: Authenticate user with username OR email
- **Body**:
  ```json
  {
    "username": "johndoe",
    "password": "password123"
  }
  ```
  OR
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response** (Success - 200):
  ```json
  {
    "success": true,
    "message": "Login successful",
    "role": "admin",
    "user": {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "admin"
    },
    "token": "jwt_token_here"
  }
  ```

#### 3. Get User Profile
- **GET** `/api/users/profile`
- **Description**: Get current user profile (requires authentication)
- **Headers**: `Authorization: Bearer <token>`
- **Response** (Success - 200):
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "admin",
      "lastLogin": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

#### 4. Update User Profile
- **PUT** `/api/users/profile`
- **Description**: Update current user profile (requires authentication)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "name": "John Smith",
    "email": "johnsmith@example.com"
  }
  ```
- **Response** (Success - 200):
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "user": {
      "id": 1,
      "name": "John Smith",
      "username": "johndoe",
      "email": "johnsmith@example.com",
      "role": "admin"
    }
  }
  ```

### Other Endpoints

#### Health Check
- **GET** `/api/health`
- **Description**: Check server health status

#### Test Endpoint
- **GET** `/api/test`
- **Description**: Test if server is running

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager') DEFAULT 'admin',

  lastLogin TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Validation Rules

### Signup Validation
- **name**: Required, 2-100 characters
- **username**: Required, 3-50 characters, unique
- **email**: Required, valid email format, unique
- **password**: Required, minimum 6 characters
- **role**: Optional, must be 'admin' or 'manager' (defaults to 'admin')

### Signin Validation
- **username OR email**: Required (either one)
- **password**: Required

## Security Features

1. **Password Hashing**: All passwords are hashed using bcryptjs with 12 salt rounds
2. **JWT Authentication**: Secure token-based authentication with 24-hour expiration
3. **Input Validation**: Comprehensive validation for all user inputs
4. **SQL Injection Protection**: Sequelize ORM provides protection against SQL injection
5. **Security Headers**: Helmet.js provides various security headers
6. **CORS Protection**: Configured CORS for cross-origin requests

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **500**: Internal Server Error

## Development

### Project Structure
```
backend/
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   └── authController.js    # Authentication logic
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   └── validation.js       # Input validation middleware
├── models/
│   ├── index.js            # Model exports
│   └── User.js             # User model
├── routes/
│   ├── auth.js             # Auth routes
│   └── userRoutes.js       # User routes
├── server.js               # Main application file
└── package.json
```

### Running Tests
```bash
npm test
```

### Environment Variables
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token generation

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure a production PostgreSQL database
4. Set up proper SSL certificates
5. Configure reverse proxy (nginx/apache)
6. Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License. 