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

  // Hotel ID validation (UUID format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!hotelId || !uuidRegex.test(hotelId)) {
    errors.push('Valid hotel ID (UUID) is required');
  }

  // Manager ID validation (UUID format)
  if (!managerId || !uuidRegex.test(managerId)) {
    errors.push('Valid manager ID (UUID) is required');
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
    checkinDate,
    checkinTime,
    checkoutDate,
    checkoutTime,
    paymentMode,
    advancePayment,
    rent,
    food,
    bill
  } = req.body;
  const errors = [];

  // Hotel ID validation (UUID format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!hotelId || !uuidRegex.test(hotelId)) {
    errors.push('Valid hotel ID (UUID) is required');
  }

  // Guest name validation
  if (!guestName || guestName.trim().length < 2 || guestName.trim().length > 200) {
    errors.push('Guest name must be between 2 and 200 characters');
  }

  // Phone number validation
  // Accepts 10-16 digit numbers, optionally starting with '+'
  const phoneRegex = /^(\+?\d{1,4}[- ]?)?\d{10,16}$/;
  if (
    !phoneNo ||
    typeof phoneNo !== 'string' ||
    !phoneRegex.test(phoneNo.trim())
  ) {
    errors.push('Please provide a valid phone number (10-16 digits, may start with country code)');
  }
  

  // Room number validation
  if (!roomNo || roomNo.trim().length === 0 || roomNo.trim().length > 20) {
    errors.push('Room number is required and must be less than 20 characters');
  }

  // Check-in time validation (required)
  if (!checkinTime) {
    errors.push('Check-in time is required');
  } else {
    // Validate time format (HH:MM:SS or HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(checkinTime)) {
      errors.push('Check-in time must be in valid time format (HH:MM or HH:MM:SS)');
    }
  }


  // Check-out must be after check-in (only validate if both dates and times are provided)
  if (checkinDate && checkoutDate && checkinTime && checkoutTime) {
    const checkinDateTime = new Date(`${checkinDate}T${checkinTime}`);
    const checkoutDateTime = new Date(`${checkoutDate}T${checkoutTime}`);
    
    if (checkoutDateTime <= checkinDateTime) {
      errors.push('Check-out date/time must be after check-in date/time');
    }
  } else if (!checkinDate && !checkoutDate && checkinTime && checkoutTime) {
    // If no dates are provided but both times are, compare times assuming same day
    const [checkinHour, checkinMin] = checkinTime.split(':').map(Number);
    const [checkoutHour, checkoutMin] = checkoutTime.split(':').map(Number);
    
    if (checkoutHour < checkinHour || (checkoutHour === checkinHour && checkoutMin <= checkinMin)) {
      errors.push('Check-out time must be after check-in time');
    }
  }

  // Payment mode validation (now expects a string)
  const allowedModes = ['card', 'cash', 'upi', 'bank_transfer', 'digital_wallet'];
  if (!paymentMode || typeof paymentMode !== 'string') {
    errors.push('Payment mode must be a non-empty string');
  } else if (!allowedModes.includes(paymentMode)) {
    errors.push(`Invalid payment mode: ${paymentMode}. Allowed modes: ${allowedModes.join(', ')}`);
  }

  // Monetary values validation
  if (advancePayment !== undefined && (isNaN(advancePayment) || parseFloat(advancePayment) < 0)) {
    errors.push('Advance payment must be a non-negative number');
  }

  if (!rent || isNaN(rent) || parseFloat(rent) < 0) {
    errors.push('Rent must be a non-negative number and is required');
  }

  if (food !== undefined && (isNaN(food) || parseFloat(food) < 0)) {
    errors.push('Food must be a non-negative number');
  }

  if (bill !== undefined && (isNaN(bill) || parseFloat(bill) < 0)) {
    errors.push('Bill must be a non-negative number');
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
    checkinDate,
    checkinTime,
    checkoutDate,
    checkoutTime,
    paymentMode,
    advancePayment,
    rent,
    food
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

  // Check-in time validation (if provided)
  if (checkinTime !== undefined) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!checkinTime || !timeRegex.test(checkinTime)) {
      errors.push('Check-in time must be in valid time format (HH:MM or HH:MM:SS)');
    }
  }

  // Check-out time validation (if provided)
  if (checkoutTime !== undefined) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(checkoutTime)) {
      errors.push('Check-out time must be in valid time format (HH:MM or HH:MM:SS)');
    }
  }

  // Check-in date validation (if provided)
  if (checkinDate !== undefined) {
    if (!checkinDate || !Date.parse(checkinDate)) {
      errors.push('Valid check-in date is required');
    }
  }

  // Check-out date validation (if provided)
  if (checkoutDate !== undefined) {
    if (!checkoutDate || !Date.parse(checkoutDate)) {
      errors.push('Valid check-out date is required');
    }
  }

  // Check-out must be after check-in (if both dates and times are provided)
  if (checkinDate && checkoutDate && checkinTime && checkoutTime) {
    const checkinDateTime = new Date(`${checkinDate}T${checkinTime}`);
    const checkoutDateTime = new Date(`${checkoutDate}T${checkoutTime}`);
    
    if (checkoutDateTime <= checkinDateTime) {
      errors.push('Check-out date/time must be after check-in date/time');
    }
  } else if (!checkinDate && !checkoutDate && checkinTime && checkoutTime) {
    // If no dates are provided but both times are, compare times assuming same day
    const [checkinHour, checkinMin] = checkinTime.split(':').map(Number);
    const [checkoutHour, checkoutMin] = checkoutTime.split(':').map(Number);
    
    if (checkoutHour < checkinHour || (checkoutHour === checkinHour && checkoutMin <= checkinMin)) {
      errors.push('Check-out time must be after check-in time');
    }
  }

   // Payment mode validation (now expects a string)
   const allowedModes = ['card', 'cash', 'upi', 'bank_transfer', 'digital_wallet'];
   if (!paymentMode || typeof paymentMode !== 'string') {
     errors.push('Payment mode must be a non-empty string');
   } else if (!allowedModes.includes(paymentMode)) {
     errors.push(`Invalid payment mode: ${paymentMode}. Allowed modes: ${allowedModes.join(', ')}`);
   }
  // Monetary values validation (if provided)
  if (advancePayment !== undefined && (isNaN(advancePayment) || parseFloat(advancePayment) < 0)) {
    errors.push('Advance payment must be a non-negative number');
  }

  if (rent !== undefined && (isNaN(rent) || parseFloat(rent) < 0)) {
    errors.push('Rent must be a non-negative number');
  }

  if (food !== undefined && (isNaN(food) || parseFloat(food) < 0)) {
    errors.push('Food must be a non-negative number');
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