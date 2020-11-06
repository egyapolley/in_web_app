const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type:String,
        lowercase:true,
        required:true,
        unique:true,
        index:{unique:true}
    },
    email:{
        type:String,
        lowercase:true,
        unique:true,
        required:true,

    },

    firstname:{
        type:String,
        lowercase:true,
        required:true,


    },
    lastname:{
        type:String,
        lowercase:true,
        required:true,

    },
    password:{
        type:String,
        required:true,

    },

    role:{
        type:String,
        required:true,
    },
    dateCreate:{
        type:Date,
        default:Date.now(),
    }
});
const User = mongoose.model("user",userSchema);

module.exports = User;



