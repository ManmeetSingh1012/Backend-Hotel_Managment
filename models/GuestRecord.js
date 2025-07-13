import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const GuestRecord = sequelize.define('GuestRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'hotels',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  serialNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  guestName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200]
    }
  },
  phoneNo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^[\+]?[1-9][\d]{0,15}$/ // International phone number format
    }
  },
  roomNo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 20]
    }
  },
  checkIn: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: true,
      isDate: true
    }
  },
  checkOut: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: true,
      isDate: true
    }
  },
  paymentModes: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      notNull: true,
      isValidPaymentModes(value) {
        const allowedModes = ['card', 'cash', 'upi', 'bank_transfer', 'digital_wallet'];
        if (!Array.isArray(value) || value.length === 0) {
          throw new Error('Payment modes must be a non-empty array');
        }
        for (const mode of value) {
          if (!allowedModes.includes(mode)) {
            throw new Error(`Invalid payment mode: ${mode}. Allowed modes: ${allowedModes.join(', ')}`);
          }
        }
      }
    }
  },
  advancePayment: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  rentBill: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      isDecimal: true,
      notNull: true
    }
  },
  foodBill: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      isDecimal: true,
      notNull: true
    }
  },
  pending: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      notNull: true,
      isDate: true
    }
  }
}, {
  tableName: 'guest_records',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  hooks: {
    beforeValidate: async (guestRecord) => {
      // Validate checkOut is after checkIn
      if (guestRecord.checkIn && guestRecord.checkOut) {
        if (new Date(guestRecord.checkOut) <= new Date(guestRecord.checkIn)) {
          throw new Error('Check-out date must be after check-in date');
        }
      }
    },
    beforeCreate: async (guestRecord) => {
      // Generate serial number if not provided
      if (!guestRecord.serialNo) {
        guestRecord.serialNo = await generateSerialNumber(guestRecord.hotelId);
      }
      
      // Calculate total amount and pending
      calculateAmounts(guestRecord);
    },
    beforeUpdate: async (guestRecord) => {
      // Calculate total amount and pending
      calculateAmounts(guestRecord);
    }
  }
});

// Helper function to generate serial number
async function generateSerialNumber(hotelId) {
  const year = new Date().getFullYear();
  const prefix = `${hotelId}-${year}-`;
  
  // Find the last record for this hotel and year
  const lastRecord = await sequelize.models.GuestRecord.findOne({
    where: {
      hotelId: hotelId,
      serialNo: {
        [sequelize.Op.like]: `${prefix}%`
      }
    },
    order: [['serialNo', 'DESC']]
  });

  let sequence = 1;
  if (lastRecord) {
    const lastSerial = lastRecord.serialNo;
    const lastSequence = parseInt(lastSerial.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
}

// Helper function to calculate amounts
function calculateAmounts(guestRecord) {
  const rentBill = parseFloat(guestRecord.rentBill) || 0;
  const foodBill = parseFloat(guestRecord.foodBill) || 0;
  const advancePayment = parseFloat(guestRecord.advancePayment) || 0;

  guestRecord.totalAmount = rentBill + foodBill;
  guestRecord.pending = Math.max(0, guestRecord.totalAmount - advancePayment);
}

export default GuestRecord; 