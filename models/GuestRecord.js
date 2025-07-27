import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const GuestRecord = sequelize.define('GuestRecord', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  },
  hotelId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'hotels',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  },
  serialNo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    autoIncrement: true,
    unique: true
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
      is: /^[\+]?[1-9][\d]{0,15}$/
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
  checkinDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    // Remove defaultValue to allow explicit null checks
    validate: {
      isDate: true
    }
  },
  checkinTime: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notNull: true
    }
  },
  checkoutDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    // Remove defaultValue to allow explicit null checks
    validate: {
      isDate: true
    }
  },
  checkoutTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  paymentMode: {
    type: DataTypes.ENUM('card', 'cash', 'upi', 'bank_transfer', 'to_harsh'),
    allowNull: false,
    validate: {
      notNull: true,
      isIn: {
        args: [['card', 'cash', 'upi', 'bank_transfer', 'to_harsh']],
        msg: 'Payment mode must be one of: card, cash, upi, bank_transfer, to_harsh'
      }
    }
  },
  advancePayment: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  rent: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      isDecimal: true,
      notNull: true
    }
  },
  food: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true, // Fixed typo: was 'ture'
    defaultValue: 0,
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  bill: {
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
    allowNull: true,
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
      const today = new Date().toISOString().split('T')[0];
      
      // Auto-populate checkin_date when checkin_time is provided but date is not
      if (guestRecord.checkinTime && !guestRecord.checkinDate) {
        guestRecord.checkinDate = today;
      }
      
      // Auto-populate checkout_date when checkout_time is provided but date is not
      if (guestRecord.checkoutTime && !guestRecord.checkoutDate) {
        console.log("checkoutDate",today,guestRecord.checkoutTime);
        guestRecord.checkoutDate = today;
      }
      
      // Validate checkout date/time is after checkin date/time
      if (guestRecord.checkinDate && guestRecord.checkoutDate && 
          guestRecord.checkinTime && guestRecord.checkoutTime) {
        const checkinDateTime = new Date(`${guestRecord.checkinDate}T${guestRecord.checkinTime}`);
        const checkoutDateTime = new Date(`${guestRecord.checkoutDate}T${guestRecord.checkoutTime}`);
        
        if (checkoutDateTime <= checkinDateTime) {
          throw new Error('Check-out date/time must be after check-in date/time');
        }
      }
    },
    beforeCreate: async (guestRecord) => {
      // Calculate bill and pending amounts
      calculateAmounts(guestRecord);
    },
    beforeUpdate: async (guestRecord) => {
      // Calculate bill and pending amounts
      calculateAmounts(guestRecord);
    }
  }
});

// Helper function to calculate amounts
function calculateAmounts(guestRecord) {
  const rent = parseFloat(guestRecord.rent) || 0;
  const food = parseFloat(guestRecord.food) || 0;
  const advancePayment = parseFloat(guestRecord.advancePayment) || 0;

  guestRecord.bill = rent + food;
  guestRecord.pending = Math.max(0, guestRecord.bill - advancePayment);
}

export default GuestRecord;