import PaymentMode from '../models/PaymentMode.js';

// Create a new payment mode
export const createPaymentMode = async (req, res) => {
  try {
    const { paymentMode } = req.body;
    const createdBy = req.user.id; // Get from authenticated user

    // Validate payment mode
    if (!paymentMode || paymentMode.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment mode is required'
      });
    }

    if (paymentMode.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Payment mode must be less than 100 characters'
      });
    }

    const paymentModeRecord = await PaymentMode.create({
      createdBy,
      paymentMode: paymentMode.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Payment mode created successfully',
      data: paymentModeRecord
    });
  } catch (error) {
    console.error('Error creating payment mode:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment mode',
      error: error.message
    });
  }
};

// Get all payment modes
export const getPaymentModes = async (req, res) => {
  try {
    const userId = req.user.id;

    const paymentModes = await PaymentMode.findAll({
      where: { createdBy: userId },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      message: 'Payment modes retrieved successfully',
      data: paymentModes,
      count: paymentModes.length
    });
  } catch (error) {
    console.error('Error fetching payment modes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment modes',
      error: error.message
    });
  }
};

// Get a single payment mode by ID
export const getPaymentModeById = async (req, res) => {
  try {
    const { id } = req.params;

    const paymentMode = await PaymentMode.findByPk(id);

    if (!paymentMode) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment mode retrieved successfully',
      data: paymentMode
    });
  } catch (error) {
    console.error('Error fetching payment mode:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment mode',
      error: error.message
    });
  }
};

// Update a payment mode
export const updatePaymentMode = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMode } = req.body;

    // Validate payment mode
    if (!paymentMode || paymentMode.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment mode is required'
      });
    }

    if (paymentMode.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Payment mode must be less than 100 characters'
      });
    }

    const paymentModeRecord = await PaymentMode.findByPk(id);

    if (!paymentModeRecord) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    await paymentModeRecord.update({
      paymentMode: paymentMode.trim()
    });

    res.status(200).json({
      success: true,
      message: 'Payment mode updated successfully',
      data: paymentModeRecord
    });
  } catch (error) {
    console.error('Error updating payment mode:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payment mode',
      error: error.message
    });
  }
};

// Delete a payment mode
export const deletePaymentMode = async (req, res) => {
  try {
    const { id } = req.params;

    const paymentMode = await PaymentMode.findByPk(id);

    if (!paymentMode) {
      return res.status(404).json({
        success: false,
        message: 'Payment mode not found'
      });
    }

    await paymentMode.destroy();

    res.status(200).json({
      success: true,
      message: 'Payment mode deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment mode:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting payment mode',
      error: error.message
    });
  }
}; 