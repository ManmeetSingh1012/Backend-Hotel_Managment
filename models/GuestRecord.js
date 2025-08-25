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
      is: {
        args: /^\d{10}$/,
        msg: 'Phone number must be exactly 10 digits'
      }
    }
  },
  roomNo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 20]
    }
  },
  checkinDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  checkinTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  checkoutDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  checkoutTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  rent: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notEmpty: true,
      min: 0
    }
  },
  bill: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notEmpty: true,
      min: 0
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  gstApplicable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'guest_records',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  hooks: {
    beforeValidate: async (guestRecord) => {
      const today = new Date().toISOString().split('T')[0];
      console.log("guestRecord1",guestRecord);
      
      // Auto-populate checkin_date when checkin_time is provided but date is not
      if (guestRecord.checkinTime && !guestRecord.checkinDate) {
        guestRecord.checkinDate = today;
      }
      
      // Auto-populate checkout_date when checkout_time is provided but date is not
      if (guestRecord.checkoutTime && !guestRecord.checkoutDate) {
        console.log("checkoutDate",today,guestRecord.checkoutTime);
        guestRecord.checkoutDate = today;
      }
      
     
    },

    beforeCreate: async (guestRecord) => {
      // Generate serial number if not provided
      if (!guestRecord.serialNo) {
        const lastRecord = await GuestRecord.findOne({
          order: [['serialNo', 'DESC']]
        });
        guestRecord.serialNo = lastRecord ? lastRecord.serialNo + 1 : 1;
      }
      
      
    },
    
  }
});


export default GuestRecord;