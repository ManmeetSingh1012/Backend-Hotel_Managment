// Validation middleware for request data

// Validate user signup data
const validateUserSignup = (req, res, next) => {
  const { name, username, email, password, role } = req.body;
  
  const errors = [];

  // Name validation
  if (!name || name.trim().length < 2 || name.trim().length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }

  // Username validation
  if (!username || username.length < 3 || username.length > 50) {
    errors.push('Username must be between 3 and 50 characters');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Please provide a valid email address');
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  // Role validation (optional, defaults to 'admin')
  if (role && !['admin', 'manager'].includes(role)) {
    errors.push('Role must be either "admin" or "manager"');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: errors.join(', ')
    });
  }

  next();
};

// Validate user signin data
const validateUserSignin = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  // Check that either username or email is provided
  if (!username && !email) {
    errors.push('Please provide either username or email');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: errors.join(', ')
    });
  }

  next();
};

// Validate room data
const validateRoomData = (req, res, next) => {
  const { roomNumber, type, capacity, price } = req.body;
  const errors = [];

  if (!roomNumber || roomNumber.toString().trim().length === 0) {
    errors.push('Room number is required');
  }

  if (!type || type.trim().length === 0) {
    errors.push('Room type is required');
  }

  if (!capacity || isNaN(capacity) || capacity < 1) {
    errors.push('Valid capacity is required');
  }

  if (!price || isNaN(price) || price < 0) {
    errors.push('Valid price is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: errors.join(', ')
    });
  }

  next();
};

// Validate hotel data
const validateHotelData = (req, res, next) => {

  
  const { name, address, phone,  totalRooms } = req.body;
  const errors = [];
 console.log(req.body)
  // Name validation
  if (!name || name.trim().length < 2 || name.trim().length > 200) {
    errors.push('Hotel name must be between 2 and 200 characters');
  }

  // Address validation
  if (!address || address.trim().length < 10 || address.trim().length > 1000) {
    errors.push('Address must be between 10 and 1000 characters');
  }

  // Phone validation
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phone || !phoneRegex.test(phone)) {
    errors.push('Please provide a valid phone number');
  }

 

  // Total rooms validation
  if (!totalRooms || isNaN(totalRooms) || totalRooms < 1) {
    errors.push('Total rooms must be at least 1');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: errors.join(', ')
    });
  }

  next();
};

// Generic validation for required fields
const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!req.body[field] || req.body[field].toString().trim().length === 0) {
        errors.push(`${field} is required`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: errors.join(', ')
      });
    }

    next();
  };
};

// Validate hotel manager assignment data
const validateHotelManagerAssignment = (req, res, next) => {
  const { hotelId, managerId } = req.body;
  const errors = [];

  // Hotel ID validation
  if (!hotelId || isNaN(hotelId) || hotelId < 1) {
    errors.push('Valid hotel ID is required');
  }

  // Manager ID validation
  if (!managerId || isNaN(managerId) || managerId < 1) {
    errors.push('Valid manager ID is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: errors.join(', ')
    });
  }

  next();
};

// Validate assignment status update
const validateAssignmentStatus = (req, res, next) => {
  const { status } = req.body;
  const errors = [];

  // Status validation
  if (!status || !['active', 'inactive'].includes(status)) {
    errors.push('Status must be either "active" or "inactive"');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: errors.join(', ')
    });
  }

  next();
};

// Validate guest record data
const validateGuestRecordData = (req, res, next) => {
  const {
    hotelId,
    guestName,
    phoneNo,
    roomNo,
    checkIn,
    checkOut,
    paymentModes,
    advancePayment,
    rentBill,
    foodBill
  } = req.body;
  const errors = [];

  // Hotel ID validation
  if (!hotelId || isNaN(hotelId) || hotelId < 1) {
    errors.push('Valid hotel ID is required');
  }

  // Guest name validation
  if (!guestName || guestName.trim().length < 2 || guestName.trim().length > 200) {
    errors.push('Guest name must be between 2 and 200 characters');
  }

  // Phone number validation
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneNo || !phoneRegex.test(phoneNo)) {
    errors.push('Please provide a valid phone number');
  }

  // Room number validation
  if (!roomNo || roomNo.trim().length === 0 || roomNo.trim().length > 20) {
    errors.push('Room number is required and must be less than 20 characters');
  }

  // Check-in date validation
  if (!checkIn || !Date.parse(checkIn)) {
    errors.push('Valid check-in date is required');
  }

  // Check-out date validation
  if (!checkOut || !Date.parse(checkOut)) {
    errors.push('Valid check-out date is required');
  }

  // Check-out must be after check-in
  if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
    errors.push('Check-out date must be after check-in date');
  }

  // Payment modes validation
  const allowedModes = ['card', 'cash', 'upi', 'bank_transfer', 'digital_wallet'];
  if (!paymentModes || !Array.isArray(paymentModes) || paymentModes.length === 0) {
    errors.push('Payment modes must be a non-empty array');
  } else {
    for (const mode of paymentModes) {
      if (!allowedModes.includes(mode)) {
        errors.push(`Invalid payment mode: ${mode}. Allowed modes: ${allowedModes.join(', ')}`);
      }
    }
  }

  // Monetary values validation
  if (advancePayment !== undefined && (isNaN(advancePayment) || advancePayment < 0)) {
    errors.push('Advance payment must be a non-negative number');
  }

  if (!rentBill || isNaN(rentBill) || rentBill < 0) {
    errors.push('Rent bill must be a non-negative number');
  }

  if (foodBill !== undefined && (isNaN(foodBill) || foodBill < 0)) {
    errors.push('Food bill must be a non-negative number');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: errors.join(', ')
    });
  }

  next();
};

// Validate guest record update data (allows partial updates)
const validateGuestRecordUpdate = (req, res, next) => {
  const {
    guestName,
    phoneNo,
    roomNo,
    checkIn,
    checkOut,
    paymentModes,
    advancePayment,
    rentBill,
    foodBill
  } = req.body;
  const errors = [];

  // Guest name validation (if provided)
  if (guestName !== undefined) {
    if (!guestName || guestName.trim().length < 2 || guestName.trim().length > 200) {
      errors.push('Guest name must be between 2 and 200 characters');
    }
  }

  // Phone number validation (if provided)
  if (phoneNo !== undefined) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneNo || !phoneRegex.test(phoneNo)) {
      errors.push('Please provide a valid phone number');
    }
  }

  // Room number validation (if provided)
  if (roomNo !== undefined) {
    if (!roomNo || roomNo.trim().length === 0 || roomNo.trim().length > 20) {
      errors.push('Room number is required and must be less than 20 characters');
    }
  }

  // Check-in date validation (if provided)
  if (checkIn !== undefined) {
    if (!checkIn || !Date.parse(checkIn)) {
      errors.push('Valid check-in date is required');
    }
  }

  // Check-out date validation (if provided)
  if (checkOut !== undefined) {
    if (!checkOut || !Date.parse(checkOut)) {
      errors.push('Valid check-out date is required');
    }
  }

  // Check-out must be after check-in (if both are provided)
  if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
    errors.push('Check-out date must be after check-in date');
  }

  // Payment modes validation (if provided)
  if (paymentModes !== undefined) {
    const allowedModes = ['card', 'cash', 'upi', 'bank_transfer', 'digital_wallet'];
    if (!Array.isArray(paymentModes) || paymentModes.length === 0) {
      errors.push('Payment modes must be a non-empty array');
    } else {
      for (const mode of paymentModes) {
        if (!allowedModes.includes(mode)) {
          errors.push(`Invalid payment mode: ${mode}. Allowed modes: ${allowedModes.join(', ')}`);
        }
      }
    }
  }

  // Monetary values validation (if provided)
  if (advancePayment !== undefined && (isNaN(advancePayment) || advancePayment < 0)) {
    errors.push('Advance payment must be a non-negative number');
  }

  if (rentBill !== undefined && (isNaN(rentBill) || rentBill < 0)) {
    errors.push('Rent bill must be a non-negative number');
  }

  if (foodBill !== undefined && (isNaN(foodBill) || foodBill < 0)) {
    errors.push('Food bill must be a non-negative number');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: errors.join(', ')
    });
  }

  next();
};

export {
  validateUserSignup,
  validateUserSignin,
  validateRoomData,
  validateHotelData,
  validateRequiredFields,
  validateHotelManagerAssignment,
  validateAssignmentStatus,
  validateGuestRecordData,
  validateGuestRecordUpdate
}; 