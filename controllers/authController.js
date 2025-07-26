import { User } from '../models/index.js';
import { generateToken } from '../middleware/auth.js';
import { Op } from 'sequelize';

// User signup
const signup = async (req, res) => {
  try {
    const { name, username, email, password, role } = req.body;

    // Check if user already exists (email or username)
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email or username already exists'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      username,
      email,
      password,
      role: role || 'admin',
      lastLogin: new Date()
    });

    // Generate token
    const token = generateToken(user.id, user.role);

    // Return user data without password
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: validationErrors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Signup failed',
      message: 'Internal server error during signup'
    });
  }
};

// User signin
const signin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate that either username or email is provided
    if (!username && !email) {
      return res.status(400).json({
        success: false,
        error: 'Login credentials required',
        message: 'Please provide either username or email'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password required',
        message: 'Password is required'
      });
    }

    // Find user by username OR email
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username: username || '' },
          { email: email || '' }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username/email or password is incorrect'
      });
    }

  

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username/email or password is incorrect'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    // Update last login
    await user.update({ lastLogin: new Date() });

    res.json({
      success: true,
      message: 'Login successful',
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({
      success: false,
      error: 'Signin failed',
      message: 'Internal server error during signin'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      message: 'Internal server error'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { name, email } = req.body;

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already exists',
          message: 'This email is already registered'
        });
      }
    }

    // Update user
    await user.update({
      name: name || user.name,
      email: email || user.email
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: 'Internal server error'
    });
  }
};

export {
  signup,
  signin,
  getProfile,
  updateProfile
}; 