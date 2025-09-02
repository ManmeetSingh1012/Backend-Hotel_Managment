import { HotelManager, GuestRecord } from '../models/index.js';

// Middleware to check if manager has access to specific hotel
export const checkManagerHotelAccess = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin has access to all hotels
    if (userRole === 'admin') {
      return next();
    }

    // For managers, check if they have active assignment to this hotel
    if (userRole === 'manager') {
      const assignment = await HotelManager.findOne({
        where: {
          managerId: userId,
          hotelId: hotelId,
          status: 'active'
        }
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this hotel'
        });
      }

      return next();
    }

    // Other roles don't have access
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'You do not have permission to access this resource'
    });

  } catch (error) {
    console.error('Hotel access middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Error checking hotel access'
    });
  }
};

// Middleware to check if user is manager of the hotel (for manager-specific operations)
export const requireManagerAccess = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only managers can access this
    if (userRole !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only managers can perform this operation'
      });
    }

    // Check if manager has active assignment to this hotel
    const assignment = await HotelManager.findOne({
      where: {
        managerId: userId,
        hotelId: hotelId,
        status: 'active'
      }
    });

    if (!assignment) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have access to this hotel'
      });
    }

    return next();

  } catch (error) {
    console.error('Manager access middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Error checking manager access'
    });
  }
};

// Middleware to check if user has access to a specific guest record
export const checkGuestRecordAccess = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admin has access to all guest records
    if (userRole === 'admin') {
      return next();
    }

    // For managers, first get the guest record to find the hotel ID
    if (userRole === 'manager') {
      const guestRecord = await GuestRecord.findByPk(bookingId);
      
      if (!guestRecord) {
        return res.status(404).json({
          success: false,
          error: 'Guest record not found',
          message: 'The specified booking ID does not exist'
        });
      }

      // Check if manager has active assignment to this hotel
      const assignment = await HotelManager.findOne({
        where: {
          managerId: userId,
          hotelId: guestRecord.hotelId,
          status: 'active'
        }
      });

      if (!assignment) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have access to this hotel'
        });
      }

      return next();
    }

    // Other roles don't have access
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'You do not have permission to access this resource'
    });

  } catch (error) {
    console.error('Guest record access middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Error checking guest record access'
    });
  }
}; 