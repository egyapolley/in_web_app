const mongoose = require("mongoose");

const userlogSchema = new mongoose.Schema({
    username: {
        type:String,
        lowercase:true,
        required:true,
    },
    transaction_type:{
        type:String,
        lowercase:true,
        required:true,

    },

    transaction_id:{
        type:String,
        required:true,

    },



    status:{
        type:String,
        lowercase:true,
        required:true,

    },

    transaction_details:{
        type:String,
        required:true,
    },
    date_created:{
        type:Date,
        default:Date.now(),
    }
});
const UserLog = mongoose.model("userlog",userlogSchema);

module.exports = UserLog;
