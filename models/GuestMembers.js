import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";


const GuestMembers = sequelize.define("GuestMembers",{

    id :{
        type :DataTypes.UUID,
        primaryKey : true,
        defaultValue : DataTypes.UUIDV4,
        allowNull : false
    },
    guestRecordId :{
        type :DataTypes.UUID,
        allowNull : false,
        references :{
            model :"guest_records",
            key : "id"
        },
        onDelete : "CASCADE",
    },
    guestName: {
    type: DataTypes.STRING(200),
    allowNull: false,
  }
 
 


},{
    tableName: 'guest_members',
    timestamps: true
})


export default GuestMembers;