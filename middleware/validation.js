// Validation middleware for request data

// Validate user signup data
const validateUserSignup = (req, res, next) => {
  const { name, username, email, password, role } = req.body;

  const errors = [];

  // Name validation
  if (!name || name.trim().length < 2 || name.trim().length > 100) {
    errors.push("Name must be between 2 and 100 characters");
  }

  // Username validation
  if (!username || username.length < 3 || username.length > 50) {
    errors.push("Username must be between 3 and 50 characters");
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("Please provide a valid email address");
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  // Role validation (optional, defaults to 'admin')
  if (role && !["admin", "manager"].includes(role)) {
    errors.push('Role must be either "admin" or "manager"');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
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
    errors.push("Please provide either username or email");
  }

  if (!password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate room data
const validateRoomData = (req, res, next) => {
  const { roomNumber, type, capacity, price } = req.body;
  const errors = [];

  if (!roomNumber || roomNumber.toString().trim().length === 0) {
    errors.push("Room number is required");
  }

  if (!type || type.trim().length === 0) {
    errors.push("Room type is required");
  }

  if (!capacity || isNaN(capacity) || capacity < 1) {
    errors.push("Valid capacity is required");
  }

  if (!price || isNaN(price) || price < 0) {
    errors.push("Valid price is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate hotel data
const validateHotelData = (req, res, next) => {
  const { name, address, phone, totalRooms } = req.body;
  const errors = [];
  console.log(req.body);
  // Name validation
  if (!name || name.trim().length < 2 || name.trim().length > 200) {
    errors.push("Hotel name must be between 2 and 200 characters");
  }

  // Address validation
  if (!address || address.trim().length < 10 || address.trim().length > 1000) {
    errors.push("Address must be between 10 and 1000 characters");
  }

  // Phone validation
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phone || !phoneRegex.test(phone)) {
    errors.push("Please provide a valid phone number");
  }

  // Total rooms validation
  if (!totalRooms || isNaN(totalRooms) || totalRooms < 1) {
    errors.push("Total rooms must be at least 1");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Generic validation for required fields
const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const errors = [];

    requiredFields.forEach((field) => {
      if (!req.body[field] || req.body[field].toString().trim().length === 0) {
        errors.push(`${field} is required`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: errors.join(", "),
      });
    }

    next();
  };
};

// Validate hotel manager assignment data
const validateHotelManagerAssignment = (req, res, next) => {
  const { hotelId, managerId } = req.query;
  const errors = [];

  // Hotel ID validation (UUID format)

  if (!hotelId) {
    errors.push("Valid hotel ID (UUID) is required");
  }

  // Manager ID validation (UUID format)
  if (!managerId) {
    errors.push("Valid manager ID (UUID) is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate assignment status update
const validateAssignmentStatus = (req, res, next) => {
  const { status } = req.body;
  const errors = [];

  // Status validation
  if (!status || !["active", "inactive"].includes(status)) {
    errors.push('Status must be either "active" or "inactive"');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate create manager and assign data
const validateCreateManagerAndAssign = (req, res, next) => {
  const { name, username, email, password } = req.body;
  const { hotelId } = req.params;
  const errors = [];

  // Hotel ID validation (UUID format)
  //const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!hotelId) {
    errors.push("Valid hotel ID (UUID) is required");
  }

  // Name validation
  if (!name || name.trim().length < 2 || name.trim().length > 100) {
    errors.push("Name must be between 2 and 100 characters");
  }

  // Username validation
  if (!username || username.length < 3 || username.length > 50) {
    errors.push("Username must be between 3 and 50 characters");
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push("Please provide a valid email address");
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
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
    checkinTime,
    paymentId,
    advancePayment,
    gstApplicable,
    rent,
    bill,
  } = req.body;
  const errors = [];

  // Hotel ID validation (UUID format)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!hotelId || !uuidRegex.test(hotelId)) {
    errors.push("Valid hotel ID (UUID) is required");
  }

  // Guest name validation
  if (
    !guestName ||
    guestName.trim().length < 2 ||
    guestName.trim().length > 200
  ) {
    errors.push("Guest name must be between 2 and 200 characters");
  }

  // Phone number validation
  // Accepts 10-16 digit numbers, optionally starting with '+'
  const phoneRegex = /^(\+?\d{1,4}[- ]?)?\d{10,16}$/;
  if (
    !phoneNo ||
    typeof phoneNo !== "string" ||
    !phoneRegex.test(phoneNo.trim())
  ) {
    errors.push(
      "Please provide a valid phone number (10-16 digits, may start with country code)"
    );
  }

  // Room number validation
  if (!roomNo || roomNo.trim().length === 0 || roomNo.trim().length > 20) {
    errors.push("Room number is required and must be less than 20 characters");
  }

  // Check-in time validation (required)
  if (!checkinTime) {
    errors.push("Check-in time is required");
  } else {
    // Validate time format (HH:MM:SS or HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(checkinTime)) {
      errors.push(
        "Check-in time must be in valid time format (HH:MM or HH:MM:SS)"
      );
    }
  }

  // Payment mode ID validation (UUID format, only if provided)
  if (paymentId !== undefined && paymentId !== null && paymentId !== "") {
    if (typeof paymentId !== "string" || !uuidRegex.test(paymentId.trim())) {
      errors.push("Valid payment mode ID (UUID) is required");
    }
  }

  if (
    rent === undefined ||
    rent === null ||
    isNaN(rent) ||
    parseFloat(rent) < 0
  ) {
    errors.push("Rent must be a non-negative number and is required");
  }

  if (bill !== undefined && (isNaN(bill) || parseFloat(bill) < 0)) {
    errors.push("Bill must be a non-negative number");
  }

  if (
    gstApplicable === undefined ||
    gstApplicable === null ||
    typeof gstApplicable !== "boolean"
  ) {
    errors.push("GST applicable must be a boolean and is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate guest record update data (allows partial updates)
const validateGuestRecordUpdate = (req, res, next) => {
  const { filter } = req.query;
  const {
    // guest info
    guestName,
    phoneNo,
    roomNo,
    checkinTime,
    rent,
    // checkout info
    checkoutTime,
    // payment info
    paymentId,
    paymentType,
    paymentAmount,
    // food info
    expenseType,
    amount,
  } = req.body;

  const errors = [];
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  switch (filter) {
    case "guest-info":
      // Validate guest information fields
      if (guestName !== undefined) {
        if (
          !guestName ||
          guestName.trim().length < 2 ||
          guestName.trim().length > 200
        ) {
          errors.push("Guest name must be between 2 and 200 characters");
        }
      }

      if (phoneNo !== undefined) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneNo || !phoneRegex.test(phoneNo)) {
          errors.push("Please provide a valid phone number");
        }
      }

      if (roomNo !== undefined) {
        if (
          !roomNo ||
          roomNo.trim().length === 0 ||
          roomNo.trim().length > 20
        ) {
          errors.push(
            "Room number is required and must be less than 20 characters"
          );
        }
      }

      if (checkinTime !== undefined) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        if (!checkinTime || !timeRegex.test(checkinTime)) {
          errors.push(
            "Check-in time must be in valid time format (HH:MM or HH:MM:SS)"
          );
        }
      }

      if (rent !== undefined) {
        if (isNaN(rent) || parseFloat(rent) < 0) {
          errors.push("Rent must be a non-negative number");
        }
      }
      break;

    case "checkout":
      // Validate checkout fields
      if (checkoutTime !== undefined) {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
        if (!timeRegex.test(checkoutTime)) {
          errors.push(
            "Check-out time must be in valid time format (HH:MM or HH:MM:SS)"
          );
        }
      }
      break;

    case "payment-info":
      // Validate payment information fields
      if (paymentId !== undefined && paymentId !== null && paymentId !== "") {
        if (
          typeof paymentId !== "string" ||
          !uuidRegex.test(paymentId.trim())
        ) {
          errors.push("Valid payment mode ID (UUID) is required");
        }
      }

      if (
        paymentType !== undefined &&
        paymentType !== null &&
        paymentType !== ""
      ) {
        const allowedPaymentTypes = ["advance", "partial", "final"];
        if (!allowedPaymentTypes.includes(paymentType)) {
          errors.push(
            `Invalid payment type: ${paymentType}. Allowed types: ${allowedPaymentTypes.join(
              ", "
            )}`
          );
        }
      }

      if (
        paymentAmount !== undefined &&
        paymentAmount !== null &&
        paymentAmount !== ""
      ) {
        if (
          isNaN(parseFloat(paymentAmount)) ||
          parseFloat(paymentAmount) <= 0
        ) {
          errors.push("Payment amount must be a positive number");
        }
      }

      // Validate required fields for payment
      if (paymentAmount && !paymentId) {
        errors.push(
          "Payment mode ID is required when payment amount is provided"
        );
      }

      if (paymentAmount && !paymentType) {
        errors.push("Payment type is required when payment amount is provided");
      }
      break;

    case "food":
      // Validate food fields
      if (amount !== undefined && amount !== null && amount !== "") {
        if (isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
          errors.push("Food amount must be a non-negative number");
        }
      }
      if (
        expenseType !== undefined &&
        expenseType !== null &&
        expenseType !== ""
      ) {
        const allowedExpenseTypes = ["food", "laundry", "others"];
        if (!allowedExpenseTypes.includes(expenseType)) {
          errors.push(
            `Invalid expense type: ${expenseType}. Allowed types: ${allowedExpenseTypes.join(
              ", "
            )}`
          );
        }
      }
      break;

    default:
      errors.push(
        "Invalid filter. Allowed filters: guest-info, checkout, payment-info, food"
      );
      break;
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate expense data
const validateExpenseData = (req, res, next) => {
  const { hotelId, expenseModeId, amount, description } = req.body;
  const errors = [];

  // Hotel ID validation
  if (!hotelId || typeof hotelId !== "string") {
    errors.push("Hotel ID is required and must be a string");
  }

  // Expense mode ID validation
  if (!expenseModeId || typeof expenseModeId !== "string") {
    errors.push("Expense mode ID is required and must be a string");
  }

  // Amount validation
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    errors.push("Amount is required and must be a positive number");
  }

  // Description validation (optional but if provided, validate length)
  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      errors.push("Description must be a string");
    } else if (description.trim().length > 1000) {
      errors.push("Description must be less than 1000 characters");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate expense update data
const validateExpenseUpdate = (req, res, next) => {
  const { expenseModeId, amount, description } = req.body;
  const errors = [];

  // Expense mode ID validation (if provided)
  if (expenseModeId !== undefined) {
    if (typeof expenseModeId !== "string") {
      errors.push("Expense mode ID must be a string");
    }
  }

  // Amount validation (if provided)
  if (amount !== undefined) {
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      errors.push("Amount must be a positive number");
    }
  }

  // Description validation (if provided)
  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      errors.push("Description must be a string");
    } else if (description.trim().length > 1000) {
      errors.push("Description must be less than 1000 characters");
    }
  }

  // Check if at least one field is provided for update
  if (
    expenseModeId === undefined &&
    amount === undefined &&
    description === undefined
  ) {
    errors.push("At least one field must be provided for update");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate payment mode data
const validatePaymentModeData = (req, res, next) => {
  const { paymentMode } = req.body;
  const errors = [];

  // Payment mode validation
  if (!paymentMode || paymentMode.trim().length === 0) {
    errors.push("Payment mode is required");
  } else if (paymentMode.trim().length > 100) {
    errors.push("Payment mode must be less than 100 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate expense mode data
const validateExpenseModeData = (req, res, next) => {
  const { expenseMode } = req.body;
  const errors = [];

  // Expense mode validation
  if (!expenseMode || expenseMode.trim().length === 0) {
    errors.push("Expense mode is required");
  } else if (expenseMode.trim().length < 2) {
    errors.push("Expense mode must be at least 2 characters");
  } else if (expenseMode.trim().length > 100) {
    errors.push("Expense mode must be less than 100 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate food data
const validateMenuData = (req, res, next) => {
  const { name, halfPlatePrice, fullPlatePrice, description } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push("Menu name is required");
  }

  if (!fullPlatePrice || isNaN(fullPlatePrice) || fullPlatePrice < 0) {
    errors.push("Full plate price must be a non-negative number");
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== "string") {
      errors.push("Description must be a string");
    } else if (description.trim().length > 1000) {
      errors.push("Description must be less than 1000 characters");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate menu search data
const validateMenuSearch = (req, res, next) => {
  const { search } = req.query;
  const errors = [];

  // If search is provided, validate it
  if (search !== undefined) {
    if (typeof search !== "string") {
      errors.push("Search parameter must be a string");
    } else if (search.length > 100) {
      errors.push("Search parameter must be less than 100 characters");
    } else if (search.trim().length === 0) {
      // Allow empty search (will return all menus), but convert to undefined
      req.query.search = undefined;
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate food expense data for adding
const validateAddFoodExpense = (req, res, next) => {
  const { menuId, portionType, quantity } = req.body;
  const { bookingId } = req.params;
  const errors = [];

  // UUID validation regex
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Booking ID validation
  if (!bookingId || !uuidRegex.test(bookingId)) {
    errors.push("Valid booking ID (UUID) is required");
  }

  // Menu ID validation
  if (!menuId || !uuidRegex.test(menuId)) {
    errors.push("Valid menu ID (UUID) is required");
  }

  // Portion type validation
  if (!portionType || !["half", "full"].includes(portionType)) {
    errors.push('Portion type must be either "half" or "full"');
  }

  // Quantity validation
  if (
    !quantity ||
    !Number.isInteger(Number(quantity)) ||
    Number(quantity) < 1
  ) {
    errors.push("Quantity must be a positive integer");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate food expense data for updating
const validateUpdateFoodExpense = (req, res, next) => {
  const { items } = req.body;

  const { expenseId } = req.params;
  const errors = [];

  // UUID validation regex
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Expense ID validation
  if (!expenseId || !uuidRegex.test(expenseId)) {
    errors.push("Valid expense ID (UUID) is required");
  }

  // Items validation
  if (!items || !Array.isArray(items) || items.length === 0) {
    errors.push("Items must be a non-empty array");
  } else {
    items.forEach((item, index) => {
      // Menu ID validation
      if (!item.menuId || !uuidRegex.test(item.menuId)) {
        errors.push(`Item ${index + 1}: Valid menu ID (UUID) is required`);
      }

      // Portion type validation
      if (!item.portionType || !["half", "full"].includes(item.portionType)) {
        errors.push(
          `Item ${index + 1}: Portion type must be either 'half' or 'full'`
        );
      }

      // Quantity validation
      if (
        !item.quantity ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1
      ) {
        errors.push(`Item ${index + 1}: Quantity must be a positive integer`);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate hotel room category data
const validateHotelRoomCategoryData = (req, res, next) => {
  const { categoryName, hotelId, roomCategoryPricing } = req.body;
  const errors = [];

  // Category name validation
  if (
    !categoryName ||
    categoryName.trim().length < 2 ||
    categoryName.trim().length > 100
  ) {
    errors.push("Category name must be between 2 and 100 characters");
  }

  if (!roomCategoryPricing) {
    errors.push("Room category pricing must be provided");
  }
  // Hotel ID validation (UUID format)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!hotelId || !uuidRegex.test(hotelId)) {
    errors.push("Valid hotel ID (UUID) is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate hotel room category update data
const validateHotelRoomCategoryUpdate = (req, res, next) => {
  const { categoryName } = req.body;
  const errors = [];

  // Category name validation (if provided)
  if (categoryName !== undefined) {
    if (
      !categoryName ||
      categoryName.trim().length < 2 ||
      categoryName.trim().length > 100
    ) {
      errors.push("Category name must be between 2 and 100 characters");
    }
  }

  // Check if at least one field is provided for update
  if (categoryName === undefined) {
    errors.push("At least one field must be provided for update");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate hotel room data
const validateHotelRoomData = (req, res, next) => {
  const { roomNo, hotelId, currentGuestName, status, categoryId } = req.body;
  const errors = [];

  // Room number validation
  if (!roomNo || roomNo.trim().length === 0 || roomNo.trim().length > 20) {
    errors.push("Room number is required and must be less than 20 characters");
  }

  // Hotel ID validation (UUID format)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!hotelId || !uuidRegex.test(hotelId)) {
    errors.push("Valid hotel ID (UUID) is required");
  }

  // Current guest name validation (optional)
  if (
    currentGuestName !== undefined &&
    currentGuestName !== null &&
    currentGuestName !== ""
  ) {
    if (currentGuestName.trim().length > 200) {
      errors.push("Current guest name must be less than 200 characters");
    }
  }

  // Status validation
  if (
    status &&
    !["ready to occupy", "occupied", "reserved", "blocked", "dirty"].includes(
      status
    )
  ) {
    errors.push("Status must be one of: empty, occupied, cleaning");
  }

  // Category ID validation (UUID format)
  if (!categoryId || !uuidRegex.test(categoryId)) {
    errors.push("Valid category ID (UUID) is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate hotel room update data
const validateHotelRoomUpdate = (req, res, next) => {
  const { roomNo, currentGuestName, status, categoryId } = req.body;
  const errors = [];

  // Room number validation (if provided)
  if (roomNo !== undefined) {
    if (!roomNo || roomNo.trim().length === 0 || roomNo.trim().length > 20) {
      errors.push(
        "Room number is required and must be less than 20 characters"
      );
    }
  }

  // Current guest name validation (if provided)
  if (currentGuestName !== undefined && currentGuestName !== null) {
    if (currentGuestName !== "" && currentGuestName.trim().length > 200) {
      errors.push("Current guest name must be less than 200 characters");
    }
  }

  // Status validation (if provided)
  if (status !== undefined) {
    if (
      !["ready to occupy", "occupied", "reserved", "blocked", "dirty"].includes(
        status
      )
    ) {
      errors.push("Status must be one of: empty, occupied, cleaning");
    }
  }

  // Category ID validation (if provided)
  if (categoryId !== undefined) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!categoryId || !uuidRegex.test(categoryId)) {
      errors.push("Valid category ID (UUID) is required");
    }
  }

  // Check if at least one field is provided for update
  if (
    roomNo === undefined &&
    currentGuestName === undefined &&
    status === undefined &&
    categoryId === undefined
  ) {
    errors.push("At least one field must be provided for update");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate guest pending payment data
const validateGuestPendingPaymentData = (req, res, next) => {
  const {
    hotelId,
    guestName,
    checkinDate,
    checkoutDate,
    pendingAmount,
    totalFood,
    rent,
    totalPayment,
  } = req.body;
  const errors = [];

  // Hotel ID validation (UUID format)

  if (!hotelId) {
    errors.push("Valid hotel ID (UUID) is required");
  }

  // Guest name validation
  if (
    !guestName ||
    guestName.trim().length < 2 ||
    guestName.trim().length > 200
  ) {
    errors.push("Guest name must be between 2 and 200 characters");
  }

  // Check-in date validation (optional)
  if (checkinDate !== undefined && checkinDate !== null && checkinDate !== "") {
    const checkinDateObj = new Date(checkinDate);
    if (isNaN(checkinDateObj.getTime())) {
      errors.push("Check-in date must be a valid date");
    }
  }

  // Check-out date validation (optional)
  if (
    checkoutDate !== undefined &&
    checkoutDate !== null &&
    checkoutDate !== ""
  ) {
    const checkoutDateObj = new Date(checkoutDate);
    if (isNaN(checkoutDateObj.getTime())) {
      errors.push("Check-out date must be a valid date");
    }
  }

  // Pending amount validation
  if (!pendingAmount || isNaN(pendingAmount) || parseFloat(pendingAmount) < 0) {
    errors.push("Pending amount must be a non-negative number and is required");
  }

  // Total food validation (optional)
  if (totalFood !== undefined && totalFood !== null && totalFood !== "") {
    if (isNaN(totalFood) || parseFloat(totalFood) < 0) {
      errors.push("Total food amount must be a non-negative number");
    }
  }

  // Rent validation (optional)
  if (rent !== undefined && rent !== null && rent !== "") {
    if (isNaN(rent) || parseFloat(rent) < 0) {
      errors.push("Rent amount must be a non-negative number");
    }
  }

  // Total payment validation (optional)
  if (
    totalPayment !== undefined &&
    totalPayment !== null &&
    totalPayment !== ""
  ) {
    if (isNaN(totalPayment) || parseFloat(totalPayment) < 0) {
      errors.push("Total payment amount must be a non-negative number");
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
    });
  }

  next();
};

// Validate guest pending payment update data
const validateGuestPendingPaymentUpdate = (req, res, next) => {
  const {
    hotelId,
    guestName,
    checkinDate,
    checkoutDate,
    pendingAmount,
    totalFood,
    rent,
    totalPayment,
  } = req.body;
  const errors = [];
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // Hotel ID validation (if provided)
  if (hotelId !== undefined) {
    if (!hotelId || !uuidRegex.test(hotelId)) {
      errors.push("Valid hotel ID (UUID) is required");
    }
  }

  // Guest name validation (if provided)
  if (guestName !== undefined) {
    if (
      !guestName ||
      guestName.trim().length < 2 ||
      guestName.trim().length > 200
    ) {
      errors.push("Guest name must be between 2 and 200 characters");
    }
  }

  // Check-in date validation (if provided)
  if (checkinDate !== undefined && checkinDate !== null && checkinDate !== "") {
    const checkinDateObj = new Date(checkinDate);
    if (isNaN(checkinDateObj.getTime())) {
      errors.push("Check-in date must be a valid date");
    }
  }

  // Check-out date validation (if provided)
  if (
    checkoutDate !== undefined &&
    checkoutDate !== null &&
    checkoutDate !== ""
  ) {
    const checkoutDateObj = new Date(checkoutDate);
    if (isNaN(checkoutDateObj.getTime())) {
      errors.push("Check-out date must be a valid date");
    }
  }

  // Pending amount validation (if provided)
  if (pendingAmount !== undefined) {
    if (isNaN(pendingAmount) || parseFloat(pendingAmount) < 0) {
      errors.push("Pending amount must be a non-negative number");
    }
  }

  // Total food validation (if provided)
  if (totalFood !== undefined && totalFood !== null && totalFood !== "") {
    if (isNaN(totalFood) || parseFloat(totalFood) < 0) {
      errors.push("Total food amount must be a non-negative number");
    }
  }

  // Rent validation (if provided)
  if (rent !== undefined && rent !== null && rent !== "") {
    if (isNaN(rent) || parseFloat(rent) < 0) {
      errors.push("Rent amount must be a non-negative number");
    }
  }

  // Total payment validation (if provided)
  if (
    totalPayment !== undefined &&
    totalPayment !== null &&
    totalPayment !== ""
  ) {
    if (isNaN(totalPayment) || parseFloat(totalPayment) < 0) {
      errors.push("Total payment amount must be a non-negative number");
    }
  }

  // Check if at least one field is provided for update
  if (
    hotelId === undefined &&
    guestName === undefined &&
    checkinDate === undefined &&
    checkoutDate === undefined &&
    pendingAmount === undefined &&
    totalFood === undefined &&
    rent === undefined &&
    totalPayment === undefined
  ) {
    errors.push("At least one field must be provided for update");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: "Validation failed",
      message: errors.join(", "),
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
  validateCreateManagerAndAssign,
  validateGuestRecordData,
  validateGuestRecordUpdate,
  validateExpenseData,
  validateExpenseUpdate,
  validatePaymentModeData,
  validateExpenseModeData,
  validateMenuData,
  validateMenuSearch,
  validateAddFoodExpense,
  validateUpdateFoodExpense,
  validateHotelRoomCategoryData,
  validateHotelRoomCategoryUpdate,
  validateHotelRoomData,
  validateHotelRoomUpdate,
  validateGuestPendingPaymentData,
  validateGuestPendingPaymentUpdate,
};
