import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const HotelConfigration = sequelize.define('hotelConfigration',{


    id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false
  },

  gstRate :{
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  }

},{
    tableName: 'hotel_configration',
    timestamps: true,
})


export default HotelConfigration;